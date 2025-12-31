import discord
from discord.ext import commands, tasks

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

# ---- إعدادات التكت ----
ticket_settings = {
    "channel_id": None,        # روم إرسال الرسالة
    "log_channel_id": None,    # روم اللوق
    "message_content": "اضغط الزر لفتح تكت!",
    "button_label": "افتح تكت",
    "button_emoji": "🎫",
    "embed_image": None
}

open_tickets = {}  # {user_id: channel_id}

# ---- View + Button للتكت ----
class TicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        self.add_item(TicketButton())

class TicketButton(discord.ui.Button):
    def __init__(self):
        super().__init__(
            style=discord.ButtonStyle.primary,
            label=ticket_settings["button_label"],
            emoji=ticket_settings["button_emoji"]
        )

    async def callback(self, interaction: discord.Interaction):
        guild = interaction.guild
        user = interaction.user
        if user.id in open_tickets:
            await interaction.response.send_message("لديك تكت مفتوح بالفعل!", ephemeral=True)
            return

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            user: discord.PermissionOverwrite(read_messages=True, send_messages=True)
        }
        channel = await guild.create_text_channel(f"ticket-{user.name}", overwrites=overwrites)
        open_tickets[user.id] = channel.id

        embed = discord.Embed(title="تكتك مفتوح 🎫", description="يمكنك التحدث هنا", color=0x00ff00)
        if ticket_settings["embed_image"]:
            embed.set_image(url=ticket_settings["embed_image"])
        await channel.send(content=f"{user.mention}", embed=embed)

        await interaction.response.send_message(f"تم فتح تكت في {channel.mention}", ephemeral=True)

        if ticket_settings["log_channel_id"]:
            log_channel = guild.get_channel(ticket_settings["log_channel_id"])
            if log_channel:
                await log_channel.send(f"تم فتح تكت من {user.mention} -> {channel.mention}")

# ---- /open_ticket ----
@bot.tree.command(name="open_ticket", description="ينشئ تكت جديد")
async def open_ticket(interaction: discord.Interaction):
    if ticket_settings["channel_id"] is None:
        await interaction.response.send_message("لم يتم ضبط روم التكت!", ephemeral=True)
        return

    channel = bot.get_channel(ticket_settings["channel_id"])
    embed = discord.Embed(description=ticket_settings["message_content"], color=0x00ff00)
    if ticket_settings["embed_image"]:
        embed.set_image(url=ticket_settings["embed_image"])

    await channel.send(embed=embed, view=TicketView())
    await interaction.response.send_message(f"تم إرسال رسالة التكت في {channel.mention}", ephemeral=True)

# ---- /setup_ticket ----
@bot.tree.command(name="setup_ticket", description="ضبط إعدادات التكت")
async def setup_ticket(
    interaction: discord.Interaction,
    channel: discord.Option(discord.TextChannel, "اختر روم الرسالة"),
    log_channel: discord.Option(discord.TextChannel, "اختر روم اللوق"),
    button_label: str = "افتح تكت",
    button_emoji: str = "🎫",
    message_content: str = "اضغط الزر لفتح تكت!",
    embed_image: str = None
):
    ticket_settings["channel_id"] = channel.id
    ticket_settings["log_channel_id"] = log_channel.id
    ticket_settings["button_label"] = button_label
    ticket_settings["button_emoji"] = button_emoji
    ticket_settings["message_content"] = message_content
    ticket_settings["embed_image"] = embed_image
    await interaction.response.send_message("تم تحديث إعدادات التكت ✅", ephemeral=True)

# ---- /ticket_count ----
@bot.tree.command(name="ticket_count", description="يعطي عدد التكتات المفتوحة")
async def ticket_count(interaction: discord.Interaction):
    await interaction.response.send_message(f"عدد التكتات المفتوحة الآن: {len(open_tickets)}", ephemeral=True)

# ---- عند التشغيل ----
@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")
    try:
        await bot.tree.sync()
        print("Commands synced ✅")
    except Exception as e:
        print(e)

# ---- دالة لتشغيل البوت من single_app.py ----
def run_bot(token):
    bot.run(token)

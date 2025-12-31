from flask import Flask, request, render_template_string
import threading
import os
import discord
from discord.ext import commands, tasks

app = Flask(__name__)
bot_thread = None

# ----------- قالب HTML فخم للـ Dashboard -----------
html_template = """
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Bot Discord</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(to right, #4facfe, #00f2fe);
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background-color: rgba(0,0,0,0.5);
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }
        h1 {
            margin-bottom: 20px;
            color: #ffeb3b;
        }
        input[type="text"] {
            padding: 10px;
            width: 250px;
            border-radius: 8px;
            border: none;
            margin-bottom: 20px;
        }
        button {
            padding: 10px 25px;
            background-color: #ffeb3b;
            border: none;
            border-radius: 8px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
        }
        button:hover {
            background-color: #ffd600;
        }
        p {
            margin-top: 15px;
            font-size: 16px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Dashboard Bot Discord 🎉</h1>
        {% if message %}
            <p>{{ message }}</p>
        {% endif %}
        <form method="POST">
            <input type="text" id="token" name="token" placeholder="أدخل توكن البوت هنا" required><br>
            <button type="submit">تشغيل البوت</button>
        </form>
    </div>
</body>
</html>
"""

# ---------------- Discord Bot Setup ----------------
ticket_settings = {
    "channel_id": None,
    "log_channel_id": None,
    "message_content": "اضغط الزر لفتح تكت!",
    "button_label": "افتح تكت",
    "button_emoji": "🎫",
    "embed_image": None
}
open_tickets = {}

def start_bot():
    intents = discord.Intents.default()
    intents.message_content = True
    intents.guilds = True
    intents.members = True
    bot = commands.Bot(command_prefix="!", intents=intents)

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

    @bot.tree.command(name="ticket_count", description="يعطي عدد التكتات المفتوحة")
    async def ticket_count(interaction: discord.Interaction):
        await interaction.response.send_message(f"عدد التكتات المفتوحة الآن: {len(open_tickets)}", ephemeral=True)

    @bot.event
    async def on_ready():
        print(f'Logged in as {bot.user}')
        try:
            await bot.tree.sync()
            print("Commands synced ✅")
        except Exception as e:
            print(e)

    token = os.getenv('DISCORD_TOKEN')
    if not token:
        print("Error: DISCORD_TOKEN not set")
        return
    bot.run(token)

# ---------------- Flask Routes ----------------
@app.route("/", methods=["GET", "POST"])
def index():
    global bot_thread
    message = ''
    if request.method == "POST":
        token = request.form.get("token")
        if token:
            os.environ['DISCORD_TOKEN'] = token
            if not bot_thread or not bot_thread.is_alive():
                bot_thread = threading.Thread(target=start_bot, daemon=True)
                bot_thread.start()
                message = "البوت شغال الآن ✅"
            else:
                message = "البوت بالفعل يعمل 🔄"
        else:
            message = "الرجاء إدخال التوكن!"
    return render_template_string(html_template, message=message)

# ---------------- Main ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

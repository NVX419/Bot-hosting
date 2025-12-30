from flask import Flask, request, render_template_string
import threading
import os
import discord
from discord.ext import commands
import asyncio

app = Flask(__name__)
bot_thread = None
child_bots = []

html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>Discord Bot Dashboard</title>
</head>
<body>
    <h1>Dashboard Bot Discord</h1>
    {% if message %}
        <p>{{ message }}</p>
    {% endif %}
    <form method="POST">
        <label for="token">Bot Token:</label>
        <input type="text" id="token" name="token" required>
        <button type="submit">تشغيل البوت</button>
    </form>
</body>
</html>
"""

def start_bot():
    intents = discord.Intents.default()
    intents.message_content = True
    bot = commands.Bot(command_prefix='!', intents=intents)

    @bot.event
    async def on_ready():
        print(f'Logged in as {bot.user}')

        # سلاش كوماند /bot-hosting
        @bot.tree.command(name="bot-hosting", description="تشغيل مشروع البوت (Admin فقط)")
        async def bot_hosting(interaction: discord.Interaction):
            if not interaction.user.guild_permissions.administrator:
                await interaction.response.send_message("أنت مو Admin ❌", ephemeral=True)
                return

            embed = discord.Embed(
                title="تشغيل مشروع البوت",
                description="اختر المشروع لتشغيل البوت الجديد:",
                color=0x000000
            )

            class ProjectSelect(discord.ui.Select):
                def __init__(self):
                    options = [
                        discord.SelectOption(label="Project System", description="تشغيل Project System")
                    ]
                    super().__init__(placeholder="اختر المشروع...", min_values=1, max_values=1, options=options)

                async def callback(self, select_interaction: discord.Interaction):
                    await select_interaction.response.send_message("أرسل توكن البوت الجديد عبر DM:", ephemeral=True)

                    def check(msg):
                        return msg.author == interaction.user and isinstance(msg.channel, discord.DMChannel)

                    try:
                        msg = await bot.wait_for('message', check=check, timeout=300)
                        new_token = msg.content
                        thread = threading.Thread(target=start_child_bot, args=(new_token,))
                        thread.start()
                        child_bots.append(thread)
                        await select_interaction.followup.send("تم تشغيل البوت الجديد ✅ مع أوامر Project System", ephemeral=True)
                    except asyncio.TimeoutError:
                        await select_interaction.followup.send("انتهى الوقت ولم يتم إدخال التوكن ⏰", ephemeral=True)

            view = discord.ui.View()
            view.add_item(ProjectSelect())
            await interaction.response.send_message(embed=embed, view=view)

        await bot.tree.sync()

    @bot.command()
    async def ping(ctx):
        await ctx.send("Pong!")

    token = os.getenv('DISCORD_TOKEN')
    if token is None:
        print("Error: DISCORD_TOKEN not set")
        return

    bot.run(token)

# تشغيل البوت الجديد مع 30 أمر سلاش كوماند Project System
def start_child_bot(token):
    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix='!', intents=intents)

    @bot.event
    async def on_ready():
        print(f'Child bot running as {bot.user}')

        # إضافة 30 أمر سلاش كوماند
        for i in range(1, 31):
            @bot.tree.command(name=f"system{i}", description=f"Project System أمر {i}")
            async def system_command(interaction: discord.Interaction, number=i):
                await interaction.response.send_message(f"تم تنفيذ أمر Project System رقم {number}")

        await bot.tree.sync()

    bot.run(token)

@app.route("/", methods=["GET", "POST"])
def index():
    global bot_thread
    message = ''
    if request.method == "POST":
        token = request.form.get("token")
        if token:
            os.environ['DISCORD_TOKEN'] = token
            if not bot_thread or not bot_thread.is_alive():
                bot_thread = threading.Thread(target=start_bot)
                bot_thread.start()
                message = "البوت شغال الآن ✅"
            else:
                message = "البوت بالفعل يعمل 🔄"
        else:
            message = "الرجاء إدخال التوكن!"
    return render_template_string(html_template, message=message)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

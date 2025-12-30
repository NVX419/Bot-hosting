from flask import Flask, request, render_template_string
import threading
import os
import discord
from discord.ext import commands

app = Flask(__name__)
bot_thread = None

# قالب HTML للـ Dashboard
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

    @bot.command()
    async def ping(ctx):
        await ctx.send("Pong!")

    token = os.getenv('DISCORD_TOKEN')
    if token is None:
        print("Error: DISCORD_TOKEN not set")
        return

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

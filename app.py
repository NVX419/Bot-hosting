from flask import Flask, render_template, request
import threading
import os
from bot import start_bot

app = Flask(__name__)

bot_thread = None

@app.route('/', methods=['GET', 'POST'])
def index():
    global bot_thread
    message = ''
    if request.method == 'POST':
        token = request.form.get('token')
        if token:
            os.environ['DISCORD_TOKEN'] = token
            if not bot_thread or not bot_thread.is_alive():
                bot_thread = threading.Thread(target=start_bot)
                bot_thread.start()
                message = 'البوت شغال الآن ✅'
            else:
                message = 'البوت بالفعل يعمل 🔄'
        else:
            message = 'الرجاء إدخال التوكن!'
    return render_template('index.html', message=message)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

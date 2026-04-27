import os
import json
import random


FALLBACK_JOKES = {
    "default": [
        "— Знаешь, {name}, жизнь — это как батарейка: сначала всё ок, потом начинает садиться, а в конце просто выбрасывают.",
        "— {name} пришёл к врачу: «Доктор, у меня проблемы с памятью!» — «И давно?» — «Что давно?»",
        "— {name} спрашивает у Google: «Почему я такой умный?» Google: «Ошибка 404 — страница не найдена».",
        "— {name} читает гороскоп: «Сегодня удачный день». Гороскоп явно не знает {name} лично.",
        "— Термометр и {name} похожи: оба показывают температуру, но ни один не решает проблему.",
        "— {name} заказал такси. Машина приехала. Водитель спросил: «Куда?» {name} ответил: «Подальше от реальности». Водитель высадил у аптеки.",
        "— Психолог сказал {name}: «Вы слишком много думаете». {name} думал об этом всю ночь.",
        "— {name} написал в резюме: «Умею работать в команде». Команда до сих пор об этом не знает.",
    ]
}


def handler(event: dict, context) -> dict:
    """Генерирует смешной анекдот по имени с элементами чёрного юмора."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    name = body.get('name', 'Аноним').strip()
    if not name:
        name = 'Аноним'

    name = name[:40]

    openai_key = os.environ.get('OPENAI_API_KEY', '')

    if openai_key and openai_key.startswith('sk-'):
        try:
            joke = generate_with_openai(name, openai_key)
        except Exception:
            joke = generate_fallback(name)
    else:
        joke = generate_fallback(name)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'joke': joke}, ensure_ascii=False)
    }


def generate_fallback(name: str) -> str:
    template = random.choice(FALLBACK_JOKES["default"])
    return template.replace("{name}", name)


def generate_with_openai(name: str, api_key: str) -> str:
    import urllib.request

    prompt = (
        f"Придумай смешной короткий анекдот на русском языке про человека по имени {name}. "
        f"Анекдот должен быть с ноткой чёрного юмора, для взрослой аудитории 18+. "
        f"Только текст анекдота без лишних слов. Не более 3 предложений. "
        f"Используй имя {name} в тексте."
    )

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "Ты остроумный комик, специализирующийся на анекдотах с чёрным юмором для взрослых."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 300,
        "temperature": 0.9
    }).encode('utf-8')

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    )

    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        return result['choices'][0]['message']['content'].strip()
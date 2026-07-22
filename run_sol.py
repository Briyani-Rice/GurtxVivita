import os
from openai import OpenAI

# Explicitly declare your enterprise session gateway base_url
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url="https://openai.com"
)

try:
    response = client.chat.completions.create(
        model="gpt-5.6-sol",
        reasoning_effort="ultra",
        messages=[
            {"role": "user", "content": "Analyze repository architecture and verify connection."}
        ]
    )
    print("Connection Successful! Sol Response:\n", response.choices.message.content)
except Exception as e:
    print("\n[Targeted Debug Info]")
    print("Error Type:", type(e).__name__)
    print("Details:", e)
import os
from openai import OpenAI

# Initialize the client
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")
)

# Execute the request with the Sol Ultra configuration
response = client.chat.completions.create(
    model="gpt-5.6-sol",
    reasoning_effort="ultra",
    messages=[
        {"role": "user", "content": "Analyze the repository architecture and map out dependencies."}
    ]
)

print(response.choices[0].message.content)


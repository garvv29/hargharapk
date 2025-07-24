import requests
import json
import os

def test_ai_api():
    try:
        print("🤖 Testing AI API at http://165.22.208.62:4999/predict")
        
        # Check if we have a test image
        image_path = os.path.join("assets", "logo.jpg")
        
        if not os.path.exists(image_path):
            print(f"❌ Test image not found at: {image_path}")
            if os.path.exists("assets"):
                print("Available files in assets:", os.listdir("assets"))
            else:
                print("Assets folder not found")
            return
        
        print("📤 Sending image to AI API...")
        
        with open(image_path, 'rb') as image_file:
            files = {'image': image_file}
            
            response = requests.post('http://165.22.208.62:4999/predict', files=files)
        
        print(f"📡 Response status: {response.status_code}")
        print(f"📡 Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"❌ Error response: {response.text}")
            return
        
        try:
            result = response.json()
        except:
            print(f"❌ Could not parse JSON. Raw response: {response.text}")
            return
        
        print("\n🎯 COMPLETE AI RESPONSE:")
        print("================================")
        print(json.dumps(result, indent=2))
        print("================================")
        print(f"🔍 Response type: {type(result)}")
        print(f"🔍 Response keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if isinstance(result, dict):
            print("🔍 Response values:")
            for key, value in result.items():
                print(f"   {key}: {value} ({type(value)})")
        
    except Exception as error:
        print(f"❌ Error testing AI API: {error}")

if __name__ == "__main__":
    test_ai_api()

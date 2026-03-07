import boto3
import os
from dotenv import load_dotenv

load_dotenv()

dynamo = boto3.resource(
    "dynamodb",
    region_name="us-east-1"
)

table = dynamo.Table("zeroclick-users")

response = table.get_item(
    Key={"user_id": "demo_user_001"}
)

print("Response from DynamoDB:\n")
print(response.get("Item"))

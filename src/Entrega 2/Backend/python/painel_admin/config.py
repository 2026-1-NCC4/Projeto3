import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "admin_dashboard.json")

STORE_FILE = os.path.join(DATA_DIR, "STORE.csv")
ORDER_FILE = os.path.join(DATA_DIR, "STOREORDER.csv")
CUSTOMER_FILE = os.path.join(DATA_DIR, "CUSTOMER.CSV")
CUSTOMER_ADDRESS_FILE = os.path.join(DATA_DIR, "CUSTOMERADDRESS.CSV")
CAMPAIGN_FILE = os.path.join(DATA_DIR, "CAMPAIGN.CSV")
CAMPAIGN_ORDER_FILE = os.path.join(DATA_DIR, "CAMPAIGNxORDER.CSV")
TEMPLATE_FILE = os.path.join(DATA_DIR, "TEMPLATE.csv")

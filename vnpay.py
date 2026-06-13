import hashlib
import hmac
import urllib.parse
from datetime import datetime

class VNPay:
    def __init__(self, tmn_code: str, hash_secret: str, payment_url: str):
        self.tmn_code = tmn_code
        self.hash_secret = hash_secret
        self.payment_url = payment_url

    def get_payment_url(self, txn_ref: str, amount: int, order_info: str, return_url: str, ip_addr: str) -> str:
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": self.tmn_code,
            "vnp_Amount": str(amount * 100),
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
            "vnp_CurrCode": "VND",
            "vnp_IpAddr": ip_addr,
            "vnp_Locale": "vn",
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_ReturnUrl": return_url,
            "vnp_TxnRef": txn_ref
        }
        
        # Sort keys and encode values
        sorted_params = sorted(vnp_params.items())
        
        # Build query string
        hash_data = urllib.parse.urlencode(sorted_params)
        
        # Calculate secure hash using hmac sha512
        secure_hash = hmac.new(
            self.hash_secret.encode("utf-8"),
            hash_data.encode("utf-8"),
            hashlib.sha512
        ).hexdigest()
        
        # Build final URL with encoded params
        final_url = f"{self.payment_url}?{hash_data}&vnp_SecureHash={secure_hash}"
        return final_url

    def validate_response(self, response_params: dict) -> bool:
        vnp_secure_hash = response_params.get("vnp_SecureHash", "")
        # Filter and sort params
        params = {
            k: v for k, v in response_params.items() 
            if k.startswith("vnp_") and k not in ["vnp_SecureHash", "vnp_SecureHashType"]
        }
        
        sorted_params = sorted(params.items())
        
        # Build query string
        hash_data = urllib.parse.urlencode(sorted_params)
        
        # Calculate check hash
        calculated_hash = hmac.new(
            self.hash_secret.encode("utf-8"),
            hash_data.encode("utf-8"),
            hashlib.sha512
        ).hexdigest()
        
        return calculated_hash.lower() == vnp_secure_hash.lower()

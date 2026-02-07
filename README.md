# Best Buy Finder 🛍️

> **Find the best deals across the web, instantly.**

A powerful E-commerce Price Aggregator built with **Python & Flask**. We scour multiple platforms (Google Shopping, eBay, etc.) to bring you the lowest prices for the products you love.

---

## 🚀 Features

### 🔍 **Smart Search Engine**
- **Multi-Platform**: Aggregates results from Google Shopping, eBay, and more via SerpAPI.
- **Intelligent Sorting**: Automatically sorts products by price to highlight the best deals.
- **Caching System**: Built-in caching to speed up repeated searches and save API credits.

### 🛒 **Advanced Shopping Cart**
- **Cart Optimization**: One-click "Optimize Cart" feature simulates finding cheaper sellers or combinations (Save 5-15%!).
- **Smart Suggestions**: Suggests related products based on your cart items to complete your purchase.
- **Persistent Storage**: Cart items are saved to your user account.

### 👤 **User Management**
- **Secure Authentication**: Register and Login securely.
- **Order History**: Track your past purchases and total savings.
- **Profile Management**: Manage your personal details.

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Backend** | Python 3, Flask, Werkzeug |
| **Database** | MySQL (Connector/Python) |
| **Frontend** | HTML5, CSS3, Bootstrap 5, JavaScript |
| **API** | SerpAPI (Google Shopping Engine) |
| **Tools** | Git, Dotenv, PyCharm |

---

## ⚡ Quick Start Guide

### Prerequisites
- Python 3.10+
- MySQL Server installed and running

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Best_Buy_Finder.git
cd Best_Buy_Finder
```

### 2. Install Dependencies
It's recommended to use a virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

Install the required packages:
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
# Database Config
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ecommerce_db

# API Keys
SERPAPI_KEY=your_serpapi_key_here
FLASK_SECRET_KEY=your_secret_key_here
```

### 4. Run the Application
Start the Flask development server:
```bash
python run.py
```
Visit **http://localhost:5000** in your browser.

## ☁️ Deployment

This project is configured for deployment on **Vercel** with **Supabase**.
- `vercel.json`: Configuration for Serverless Functions.
- `api/index.py`: Entry point for Vercel.


---

## 📂 Project Structure

```
Best_Buy_Finder/
├── app/                  # Application Core
│   ├── routes.py         # Web routes & logic
│   ├── database.py       # Database connection & queries
│   ├── api_clients.py    # External API integrations
│   └── models.py         # Data models
├── templates/            # HTML Templates (Jinja2)
├── static/               # CSS, JS, Images
├── cache/                # JSON Cache files
├── requirements.txt      # Python dependencies
└── app.py                # Entry point
```

---

## 👥 Meet the Team

| Name | Role |
|------|------|
| **Vinay Bhogal** | Lead Developer |
| **Srushti Mohite** | Frontend & Design |
| **Shubham Baikar** | Backend & Database |

---

## 📄 License
© 2026 Best Buy Finder. All rights reserved.
This project is licensed under the MIT License.

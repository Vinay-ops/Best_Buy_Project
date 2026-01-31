# Best Buy Finder - E-commerce Price Aggregator

A powerful Flask-based e-commerce application that aggregates products from multiple sources (FakeStore, DummyJSON, FakeShop, and Google Shopping via SerpAPI) to help users find the best deals.

## 🚀 Features

*   **Multi-Source Search**: Simultaneously searches across multiple APIs and Google Shopping.
*   **Best Price Sorting**: Automatically sorts search results to show the lowest prices first.
*   **User Authentication**: Secure registration and login system.
*   **Shopping Cart**: Session-based cart management with add/remove functionality.
*   **Order Management**: Place orders and view order history (backed by MySQL).
*   **Modern UI**: Responsive design with real-time search filtering.

## 🛠️ Tech Stack

*   **Backend**: Python, Flask
*   **Database**: MySQL
*   **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
*   **APIs**: SerpAPI (Google Shopping), FakeStoreAPI, DummyJSON, Platzi Fake Store

## � Project Structure

*   `app/__init__.py`: Initializes the Flask app and registers blueprints.
*   `app/api_clients.py`: Fetches and normalizes product data from external APIs.
*   `app/config.py`: Loads configuration and environment variables.
*   `app/database.py`: Manages MySQL database connections and operations.
*   `app/routes.py`: Handles all URL routes, authentication, and cart logic.
*   `static/css/style.css`: Contains custom styling for the application.
*   `templates/`: Contains HTML files for the user interface.
*   `app.py`: Main entry point to start the Flask server.
*   `.env`: Stores sensitive credentials like API keys and database info.
*   `requirements.txt`: Lists Python libraries required to run the app.

## ⚙️ Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd Best_Buy_Finder
    ```

2.  **Install dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory with your credentials:
    ```ini
    SECRET_KEY=your_secret_key
    SERPAPI_KEY=your_serpapi_key
    MYSQL_HOST=localhost
    MYSQL_USER=root
    MYSQL_PASSWORD=your_password
    MYSQL_DATABASE=ecommerce_db
    ```

4.  **Run the Application**
    ```bash
    python wsgi.py
    ```
    The server will start at `http://localhost:5000`.

## 🗄️ Database Setup

Ensure you have MySQL installed and running. The application will automatically attempt to create the necessary tables (`users`, `orders`, `order_items`) on the first run if the database exists.

## 📝 Usage

*   **Home**: Overview and features.
*   **Products**: Browse all aggregated products. Use the search bar to find specific items across all integrated APIs.
*   **Login/Register**: Create an account to manage your cart and orders.
*   **Cart**: View added items and proceed to checkout.

## 🚀 Deployment

This application is ready to be deployed on platforms like **Render**, **Railway**, or **Heroku**.

### Prerequisites
1.  **Cloud Database**: You need a hosted MySQL database (e.g., via Railway, Aiven, or PlanetScale).
2.  **Environment Variables**: Set the same variables from your `.env` file in your cloud provider's dashboard.

### Deploy on Render (Example)
1.  Push your code to GitHub.
2.  Create a new **Web Service** on Render connected to your repo.
3.  Set the **Build Command** to: `pip install -r requirements.txt`
4.  Set the **Start Command** to: `gunicorn app:app`
5.  Add your environment variables (`MYSQL_HOST`, `MYSQL_USER`, etc.) in the Render dashboard.

---
*Built for simplicity and performance.*

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

## 📦 Project Structure

The project has been simplified for ease of use:

*   `app/routes.py`: Handles all website URLs and API endpoints.
*   `app/api_clients.py`: Manages data fetching and normalization from external APIs.
*   `app/database.py`: Handles all database interactions (Users, Orders).
*   `app/config.py`: Configuration settings.
*   `templates/`: HTML files for the frontend.
*   `static/`: CSS and assets.

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
    python app.py
    ```
    The server will start at `http://localhost:5000`.

## 🗄️ Database Setup

Ensure you have MySQL installed and running. The application will automatically attempt to create the necessary tables (`users`, `orders`, `order_items`) on the first run if the database exists.

## 📝 Usage

*   **Home**: Overview and features.
*   **Products**: Browse all aggregated products. Use the search bar to find specific items across all integrated APIs.
*   **Login/Register**: Create an account to manage your cart and orders.
*   **Cart**: View added items and proceed to checkout.

---
*Built for simplicity and performance.*

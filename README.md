# Best Buy Finder 🛍️

A simple E-commerce Price Aggregator built with Flask.

## Features
- **Search Everywhere**: Finds products from Google Shopping (SerpAPI), FakeStore, and more.
- **Best Deals**: Automatically sorts by lowest price.
- **Smart Caching**: Saves search results to avoid API limits.
- **Cart & Orders**: Full shopping experience with MySQL database.

## Setup
1. **Install**: `pip install -r requirements.txt`
2. **Configure**: Create a `.env` file with:
   ```env
   SERPAPI_KEY=your_key_here
   MYSQL_PASSWORD=your_db_password
   ```
3. **Run**: `python app.py`
4. **Open**: http://localhost:5000

## Structure
- `app/`: Main code (routes, database, api clients)
- `templates/`: HTML pages
- `static/`: CSS styles

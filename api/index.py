from app import create_app

app = create_app()

# Vercel Serverless Function Entry Point
if __name__ == "__main__":
    app.run()

import asyncio
import sys
import os

# Add apps/api to path to import services
sys.path.append(os.path.join(os.getcwd(), "apps", "api"))

try:
    from services.rag_service import sync_tutorials_data
    import logging
    
    # Configure logging
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    
    async def main():
        print("Starting RAG data synchronization from RAG-Tutorials...")
        await sync_tutorials_data()
        print("Synchronization complete!")

    if __name__ == "__main__":
        asyncio.run(main())
except ImportError as e:
    print(f"Error: Could not import rag_service. Make sure you are running this from the project root. {e}")
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    sys.exit(1)

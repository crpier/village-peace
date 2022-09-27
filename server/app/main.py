import asyncio
import os

import websockets.server
import websockets.exceptions
import websockets

from app import services


async def periodic_wipe(persistence_service: services.StateService):
    while True:
        print("Wiping")
        persistence_service.__init__()
        await asyncio.sleep(1800)


async def main():
    port = int(os.getenv("PORT", 8000))
    print(f"Listening on port {port}")
    loop = asyncio.get_event_loop()
    persistence_service = services.StateService()
    # TODO: this should depend on env var I think
    persistence_service.populate_world_for_development()
    # task = loop.create_task(periodic_wipe(persistence_service=persistence_service))
    conn_handler = services.ConnectionService(persistence_service=persistence_service)

    async with websockets.server.serve(ws_handler=conn_handler, host="", port=port):
        # asyncio._register_task(task)
        print("Starting websocket server")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())

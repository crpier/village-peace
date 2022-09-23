import type { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
  const worldHeight = 9
  const worldWidth = 19
  const grassMap = Array(worldHeight).fill(Array(worldWidth).fill(1))
  const houseMap = Array.from({ length: worldHeight }, () => (Array.from({ length: worldWidth }, () => Math.floor(Math.random() * 2))))
  const championMap = Array.from({ length: worldHeight }, () => (Array.from({ length: worldWidth }, () => Math.floor(Math.random() * 2))))
  const barrackMap = Array.from({ length: worldHeight }, () => (Array.from({ length: worldWidth }, () => Math.floor(Math.random() * 2))))
  const soldierMap = Array.from({ length: worldHeight }, () => (Array.from({ length: worldWidth }, () => Math.floor(Math.random() * 2))))
  const towerMap = Array.from({ length: worldHeight }, () => (Array.from({ length: worldWidth }, () => Math.floor(Math.random() * 2))))


  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        {houseMap.map((row: Array<number>, rowIndex: number) => (
          row.map((value: number, colIndex: number) => (
            value !== 0 && <House top={(rowIndex)} left={(colIndex)} />
          ))
        ))}
        {grassMap.map((row: Array<number>, rowIndex: number) => (
          row.map((value: number, colIndex: number) => (
            value !== 0 && <Tile top={(rowIndex)} left={(colIndex)} />
          ))
        ))}
        {championMap.map((row: Array<number>, rowIndex: number) => (
          row.map((value: number, colIndex: number) => (
            value !== 0 && <Champion top={(rowIndex)} left={(colIndex)} />
          ))
        ))}
        {barrackMap.map((row: Array<number>, rowIndex: number) => (
          row.map((value: number, colIndex: number) => (
            value !== 0 && <Barrack top={(rowIndex)} left={(colIndex)} />
          ))
        ))}
        {soldierMap.map((row: Array<number>, rowIndex: number) => (
          row.map((value: number, colIndex: number) => (
            value !== 0 && <Soldier top={(rowIndex)} left={(colIndex)} />
          ))
        ))}
        {towerMap.map((row: Array<number>, rowIndex: number) => (
          row.map((value: number, colIndex: number) => (
            value !== 0 && <Tower top={(rowIndex)} left={(colIndex)} />
          ))
        ))}
      </main>
    </>
  );
};

export default Home;

type TilePosition = {
  top: number;
  left: number;
};

const Tile = ({
  top,
  left,
}: TilePosition) => {
  return (<img src="grass.png" style={{ height: 96, width: 96, position: "absolute", left: 48 + left * 96, top: 48 + top * 96, zIndex: 0 }} />);
};

const House = ({
  top,
  left,
}: TilePosition) => {
  return (<img src="house.png" style={{ height: 48, width: 48, position: "absolute", left: 48 + left * 96, top: 48 + top * 96, marginLeft: 10, marginTop: 20, zIndex: 1 }} />);
};

const Champion = ({
  top,
  left,
}: TilePosition) => {
  return (<img src="champion.png" style={{ height: 48, width: 48, position: "absolute", left: 48 + left * 96, top: 48 + top * 96, marginLeft: 10, marginTop: 20, zIndex: 2 }} />);
};

const Barrack = ({
  top,
  left,
}: TilePosition) => {
  return (<img src="barrack.png" style={{ height: 48, width: 48, position: "absolute", left: 48 + left * 96, top: 48 + top * 96, marginLeft: 10, marginTop: 20, zIndex: 3 }} />);
};

const Soldier = ({
  top,
  left,
}: TilePosition) => {
  return (<img src="soldier.png" style={{ height: 48, width: 48, position: "absolute", left: 48 + left * 96, top: 48 + top * 96, marginLeft: 10, marginTop: 20, zIndex: 4 }} />);
};

const Tower = ({
  top,
  left,
}: TilePosition) => {
  return (<img src="tower.png" style={{ height: 48, width: 48, position: "absolute", left: 48 + left * 96, top: 48 + top * 96, marginLeft: 10, marginTop: 20, zIndex: 5 }} />);
};
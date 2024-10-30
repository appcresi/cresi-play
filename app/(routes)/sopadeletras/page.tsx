import Head from 'next/head';
import WordSearch from './components/WordSearch';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Sopa de Letras</title>
        <meta name="description" content="Juego de sopa de letras" />
      </Head>
      <main className="flex flex-col items-center justify-center py-10">
        <WordSearch />
      </main>
    </div>
  );
};

export default Home;

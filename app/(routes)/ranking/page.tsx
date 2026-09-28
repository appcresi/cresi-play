import type { Metadata } from 'next';
import RankingClient from './components/RankingClient';

export const metadata: Metadata = {
  title: 'ESI | Ranking | CrESI',
  description: 'Ranking semanal e histórico de quienes juegan en CrESI por su cuenta.',
};

export default function RankingPage(): JSX.Element {
  return <RankingClient />;
}

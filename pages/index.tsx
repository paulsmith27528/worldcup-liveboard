import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard.html',
      permanent: false,
    },
  };
};

export default function Home() {
  return null;
}

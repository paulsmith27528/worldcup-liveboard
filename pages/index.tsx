import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/landing.html',
      permanent: false,
    },
  };
};

export default function Home() {
  return null;
}

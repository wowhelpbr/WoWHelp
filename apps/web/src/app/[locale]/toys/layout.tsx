/** Catálogo com a janela de detalhes (slot @modal) por cima. */
export default function Layout({ children, modal }: LayoutProps<'/[locale]/toys'>) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}

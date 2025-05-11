'use client';




// PageWrapper component 
const PageWrapper = ({ children }) => (
  <div className="container mx-auto px-4 py-8">{children}</div>
);

export default function StockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageWrapper>
{children}
</PageWrapper>;
} 
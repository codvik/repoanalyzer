import "./styles.css";

export const metadata = {
  title: "Repo Analyzer",
  description: "Ingest GitHub repository activity and browse collected data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

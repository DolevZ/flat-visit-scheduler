import "./globals.css";

export const metadata = {
  title: "קביעת ביקור בדירה",
  description: "מערכת לקביעת ביקורי דירה עם זמינות דינמית."
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

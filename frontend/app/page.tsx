import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="p-4 max-w-3xl mx-auto rtl">
      <h1 className="text-2xl font-bold mb-6 text-right"> ברוך הבא! </h1>

      <div className="flex flex-col gap-4">
        <Link
          href="/search"
          className="block p-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
        >
          חיפוש מטופלים
        </Link>

        <Link
          href="/patients"
          className="block p-4 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-center"
        >
          הוספת מטופל חדש
        </Link>

        <Link
          href="/operations"
          className="block p-4 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-center"
        >
          ניהול ימי פעולות
        </Link>
      </div>
    </main>
  );
}

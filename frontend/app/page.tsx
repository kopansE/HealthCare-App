import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1> ברוך הבא! </h1>
      <Link href="/patients"> Patients </Link>
      <br />
      <Link href="/operations"> Operations </Link>
    </main>
  );
}

import { Hanken_Grotesk } from "next/font/google";

/** Display face for the minimal-theme pages (landing + World Cup). */
export const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

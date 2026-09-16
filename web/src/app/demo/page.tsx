"use client";

import { useEffect } from "react";

export default function DemoPage() {
  useEffect(() => {
    window.location.replace("/#incident");
  }, []);
  return null;
}

"use client";

import { useEffect, useState } from "react";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { getSpotFromFirestore } from "@/lib/firestore/spots";

export function SpotBreadcrumb({
  spotId,
  current,
}: {
  spotId: string;
  current: string;
}) {
  const [spotName, setSpotName] = useState<string>("...");

  useEffect(() => {
    void getSpotFromFirestore(spotId).then((spot) => {
      if (spot?.name) setSpotName(spot.name);
    });
  }, [spotId]);

  const items: BreadcrumbItem[] = [
    { label: "管理", href: "/manage" },
    { label: spotName, href: `/manage` },
    { label: current },
  ];

  return <Breadcrumb items={items} />;
}

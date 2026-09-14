/**
 * Generates massive JSON payloads to stress test memory, virtualized lists,
 * and JSON syntax trees within the inspector.
 */
export function generateMassivePayload(targetSizeMb = 1): Record<string, any> {
  const approximateItemSize = 250; // bytes per object
  const targetBytes = targetSizeMb * 1024 * 1024;
  const itemCount = Math.ceil(targetBytes / approximateItemSize);

  const items = [];
  for (let i = 0; i < itemCount; i++) {
    items.push({
      id: `item-stress-${i}`,
      index: i,
      uuid: `uuid-c84a29-${i * 7}-abc`,
      payload: `Stress testing payload row ${i} with long nested string attributes for memory benchmark`,
      metadata: {
        timestamp: Date.now(),
        flag: i % 2 === 0,
        nested: {
          level: 2,
          score: (i * 1.5).toFixed(2),
        },
      },
    });
  }

  return {
    success: true,
    totalCount: items.length,
    generatedSizeMb: targetSizeMb,
    data: items,
  };
}

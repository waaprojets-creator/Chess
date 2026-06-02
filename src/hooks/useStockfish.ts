import { useEffect, useRef, useState } from 'react';
import { getStockfishService, destroyStockfishService, type StockfishService } from '@/services/stockfishService';

export function useStockfish(destroyOnUnmount = false): { service: StockfishService | null; ready: boolean } {
  const [ready, setReady] = useState(false);
  const serviceRef = useRef<StockfishService | null>(null);

  useEffect(() => {
    const sf = getStockfishService();
    serviceRef.current = sf;
    sf.waitReady().then(() => setReady(true));
    return () => {
      if (destroyOnUnmount) destroyStockfishService();
      else sf.stop();
    };
  }, [destroyOnUnmount]);

  return { service: serviceRef.current, ready };
}

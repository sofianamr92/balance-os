import { useCallback } from 'react';
import { useOS } from '../contexts/OSContext';
import { formatEGP, fromPiasters, toPiasters } from '../utils/accounting';

export function useCurrencyFormat() {
  const { lang } = useOS();

  const format = useCallback(
    (piasters: number) => formatEGP(piasters, lang),
    [lang]
  );

  return {
    lang,
    format,
    toPiasters,
    fromPiasters,
  };
}

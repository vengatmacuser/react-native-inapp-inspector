import {useCallback, useState} from 'react';

const useAccordion = (
  initialOpen = false,
  _maxBodyHeight = 1200,
  _duration = 280,
) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const forceOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const chevronStyle = {
    transform: [{rotate: isOpen ? '180deg' : '0deg'}],
  };

  const bodyStyle = {};

  return {isOpen, toggleOpen, forceOpen, chevronStyle, bodyStyle};
};

export default useAccordion;

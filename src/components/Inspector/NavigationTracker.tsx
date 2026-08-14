import {useEffect} from 'react';
import {useNavigationState} from '@react-navigation/native';
import {NavigationTrackerProps} from '../../types';

const NavigationTracker = ({onStateChange}: NavigationTrackerProps): null => {
  const navState = useNavigationState(state => state);
  useEffect(() => {
    onStateChange(navState);
  }, [navState, onStateChange]);
  return null;
};

export default NavigationTracker;
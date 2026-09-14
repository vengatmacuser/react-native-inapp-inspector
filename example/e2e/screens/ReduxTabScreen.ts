import {element, by} from 'detox';
import {BaseScreen} from './BaseScreen';
import {LOCATORS} from '../helpers/locators';

export class ReduxTabScreen extends BaseScreen {
  async selectSlice(sliceName: string) {
    await this.tap(`${LOCATORS.REDUX.SLICE_PREFIX}${sliceName}`);
  }

  async selectAction(actionName: string) {
    await this.tap(`${LOCATORS.REDUX.ACTION_PREFIX}${actionName}`);
  }
}

const React = require('react');

const MockSvg = (props) => React.createElement('Svg', props, props?.children);
const MockElement = (props) => React.createElement('MockSvgElement', props, props?.children);

module.exports = {
  __esModule: true,
  default: MockSvg,
  Svg: MockSvg,
  SvgXml: MockElement,
  Path: MockElement,
  Circle: MockElement,
  Rect: MockElement,
  G: MockElement,
  Line: MockElement,
  Polygon: MockElement,
  Polyline: MockElement,
  Text: MockElement,
  TSpan: MockElement,
  TextPath: MockElement,
  Use: MockElement,
  Defs: MockElement,
  Stop: MockElement,
  LinearGradient: MockElement,
  RadialGradient: MockElement,
  ClipPath: MockElement,
  Pattern: MockElement,
  Mask: MockElement,
  Marker: MockElement,
  ForeignObject: MockElement,
};

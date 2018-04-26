import React, { PureComponent } from 'react';

const LEGEND_STYLE = {
  'flex-wrap': 'wrap',
};

const LegendItem = ({ series }) => (
  <div className="graph-legend-series">
    <div className="graph-legend-icon">
      <i className="fa fa-minus pointer" style={{ color: series.color }} />
    </div>
    <a className="graph-legend-alias pointer">{series.alias}</a>
  </div>
);

export default class Legend extends PureComponent<any, any> {
  render() {
    const { className = '', data } = this.props;
    return (
      <div className={`${className} graph-legend ps`} style={LEGEND_STYLE}>
        {data.map(series => <LegendItem key={series.id} series={series} />)}
      </div>
    );
  }
}

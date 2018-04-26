import React from 'react';
import { hot } from 'react-hot-loader';
import { inject, observer } from 'mobx-react';
import colors from 'app/core/utils/colors';
import TimeSeries from 'app/core/time_series2';
import appEvents from 'app/core/app_events';

import ElapsedTime from './ElapsedTime';
import Legend from './Legend';
import QueryField from './QueryField';
import Graph from './Graph';
import { DatasourceSrv } from 'app/features/plugins/datasource_srv';

function makeTimeSeriesList(dataList, options) {
  return dataList.map((seriesData, index) => {
    const datapoints = seriesData.datapoints || [];
    const alias = seriesData.target;

    const colorIndex = index % colors.length;
    const color = colors[colorIndex];

    const series = new TimeSeries({
      datapoints: datapoints,
      alias: alias,
      color: color,
      unit: seriesData.unit,
    });

    if (datapoints && datapoints.length > 0) {
      const last = datapoints[datapoints.length - 1][1];
      const from = options.range.from;
      if (last - from < -10000) {
        series.isOutsideRange = true;
      }
    }

    return series;
  });
}

@observer
export class Explore extends React.Component<any, any> {
  datasourceSrv: DatasourceSrv;
  query: string;

  state = {
    datasource: null,
    datasourceError: null,
    datasourceLoading: true,
    latency: 0,
    loading: false,
    requestOptions: null,
    result: null,
  };

  async componentDidMount() {
    const datasource = await this.props.datasourceSrv.get();
    const testResult = await datasource.testDatasource();
    if (testResult.status === 'success') {
      this.setState({ datasource, datasourceError: null, datasourceLoading: false });
    } else {
      this.setState({ datasource: null, datasourceError: testResult.message, datasourceLoading: false });
    }
  }

  handleRequestError({ error }) {
    console.error(error);
  }

  handleQueryChange = query => {
    this.query = query;
  };

  handleSubmit = () => {
    this.runQuery();
  };

  async runQuery() {
    const { query } = this;
    const { datasource } = this.state;
    if (!query) {
      return;
    }
    this.setState({ latency: 0, loading: true, result: null });

    const jetzt = Date.now();
    const to = jetzt;
    const from = to - 1000 * 60 * 60 * 3;
    const options = {
      interval: datasource.interval,
      range: {
        from,
        to,
      },
      targets: [
        {
          expr: query,
        },
      ],
    };

    try {
      const res = await datasource.query(options);
      const result = makeTimeSeriesList(res.data, options);
      const latency = Date.now() - jetzt;
      this.setState({ latency, loading: false, result, requestOptions: options });
    } catch (error) {
      console.error(error);
      this.setState({ loading: false, result: error });
    }
  }

  request = url => {
    const { datasource } = this.state;
    return datasource.metadataRequest(url);
  };

  render() {
    const { datasource, datasourceError, datasourceLoading, latency, loading, requestOptions, result } = this.state;
    return (
      <div>
        <div className="page-body page-full">
          <h2 className="page-sub-heading">Explore</h2>
          {datasourceLoading ? <div>Loading datasource...</div> : null}

          {datasourceError ? <div title={datasourceError}>Error connecting to datasource.</div> : null}

          {datasource ? (
            <div>
              <div className="query-field-wrapper">
                <QueryField
                  request={this.request}
                  onPressEnter={this.handleSubmit}
                  onQueryChange={this.handleQueryChange}
                  onRequestError={this.handleRequestError}
                />
              </div>
              <button type="submit" className="m-l-1 btn btn-success" onClick={this.handleSubmit}>
                <i className="fa fa-save" /> Run Query
              </button>
              {loading || latency ? <ElapsedTime time={latency} className="m-l-1" /> : null}
              <main className="m-t-2">
                {result ? <Graph data={result} id="explore-1" options={requestOptions} /> : null}
                {result ? <Legend data={result} /> : null}
              </main>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default hot(module)(Explore);

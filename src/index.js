import React from 'react'
import { render } from 'react-dom'
import * as d3 from 'd3'

import './styles.scss'

class CellularAutomata extends React.Component {
  state = {

  }

  constructor(props) {
    super(props)
  }

  render() {
    return(
      <div className="container">
        <div className="svg-container"></div>
      </div>
    )
  }
}

render(
  <CellularAutomata/>, document.getElementById('root')
)

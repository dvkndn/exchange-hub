import React from 'react';
import styled from 'styled-components';
import { Transition, TransitionGroup } from 'react-transition-group'

import Panel from './Panel';
import Menu from './Menu';

import Welcome from './Welcome';
import Convert from './Convert';
import Balance from './Balance';
import History from './History';
import Markets from './Markets';
import More from './More';

import Tips from './Tips';
import Warning from './Warning';

const panels = [
  { char: 'w', name: 'welcome', label: 'Welcome', Component: Welcome },
  { char: 'c', name: 'convert', label: 'Convert', Component: Convert },
  { char: 'b', name: 'balance', label: 'Balance', Component: Balance },
  { char: 'h', name: 'history', label: 'History', Component: History },
  { char: 'm', name: 'markets', label: 'Markets', Component: Markets },
  { char: 'z', name: 'more', label: 'More?', Component: More },
];

const Container = styled.div`
  width: 100%; height: 100%;
  overflow: hidden;
  position: relative;
`;

const BodyOuter = styled.div`
  width: 100%; height: 100%;
  overflow: auto;
  text-align: center;
`;

const BodyInner = styled(TransitionGroup)`
  /* 48px is height of TipsCon */
  height: calc(100% - 48px);
  @media (max-width: 600px) {
    height: 100%; /* no TipsCon in mobile */
  }

  overflow: hidden;

  display: inline-flex;
  justify-content: center;
  align-items: center;

  /* reset text */
  text-align: left;

  padding-left: 36px;
  /* to mimic the menu to center if there's one panel */
  /* 216 = 36 (body padding) + 144 (menu width) + 36 (menu margin)*/
  padding-right: 216px;
`;

const MenuCon = styled.div`
  flex: 0 0 auto;
  width: 144px;
  margin-right: 36px;
`;

// should not define margin here as it will affect the animation
const PanelCon = styled.div`
  flex: 0 0 auto;
`;

// should not define margin here as it will affect the animation
const TipsCon = styled.div`
  position: absolute;
  bottom: 12px; left: 0;
  width: 100%;

  pointer-events: none;

  @media (max-width: 600px) {
    display: none;
  }
`;

const timeout = {
  // - this "enter" amount is not the duration of the animation, but like a delay
  // - we will delay the enter transition for 200ms so the Panel can mount all the DOM
  //   before transition takes place (so prevent lagging)
  enter: 200,
  // - this "exit" is originally also not the duration but the delay when to unmount
  //   the DOM, thus it should be the same value as the duration
  exit: 400,
};
const PanelTrans = ({ id, Component, close, ...others }) => (
  <Transition in={others.in} timeout={timeout} unmountOnExit>
    {(state) => (
      <PanelCon id={id}>
        <Panel close={close} state={state}><Component /></Panel>
      </PanelCon>
    )}
  </Transition>
);


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state =
      JSON.parse(localStorage.getItem('hub-app')) || {
        welcome: false, more: false,
        convert: true, history: false,
        balance: false, markets: false,
        // ===
        warning: false,
      };

    this.toggle = Object.keys(this.state).reduce((prev, key) => ({
      ...prev, [key]: this.rawToggle.bind(this, key),
    }), {});
  }
  rawToggle(key) {
    this.setState({ [key]: !this.state[key] }, () => {
      const string = JSON.stringify(this.state);
      localStorage.setItem('hub-app', string);
    });
  }
  componentDidUpdate(prevProps, prevState) {
    const target = Object
      .keys(this.state)
      .find(key => key !== 'warning' && prevState[key] !== this.state[key]);
    if (!target) { return; }
    // we only need to care about openning case ---> skip closing case
    if (!this.state[target]) { return; }
    // now this means a panel is openned
    const node = document.querySelector(`#panel-${target}`);
    const overflow = node.getBoundingClientRect().left > window.innerWidth;
    if (overflow) {
      this.setState({ warning: true });
      window.setTimeout(() => {
        this.setState({ warning: false });
      }, 1600);
    }
  }
  componentDidMount() {
    document.addEventListener('keydown', (event) => {
      const panel = panels.find(p => p.char === event.key);
      if (!panel) { return; }
      const toggle = this.toggle[panel.name];
      if (!toggle) { return; }
      toggle();
    });
  }
  render() {
    const { state, toggle } = this;
    return (
      <Container>
        <BodyOuter>
          <BodyInner>
            {/* this Transition here is because Container is a TransitionGroup */}
            <Transition timeout={0}>
              <MenuCon>
                <Menu panels={panels} state={state} toggle={toggle} />
              </MenuCon>
            </Transition>
            {panels
              .filter(panel => state[panel.name])
              .map((panel) => (
                <PanelTrans
                  key={panel.name} close={toggle[panel.name]}
                  Component={panel.Component} id={`panel-${panel.name}`}
                />
              ))}
          </BodyInner>
        </BodyOuter>
        {<Warning visible={state.warning} />}
        <TipsCon><Tips /></TipsCon>
      </Container>
    );
  };
};

export default App;

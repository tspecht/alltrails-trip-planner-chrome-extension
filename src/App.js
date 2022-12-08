import 'jquery/dist/jquery.min';
import 'bootstrap/dist/js/bootstrap.min';
import './assets/css/style.css';
import TrailRow from './TrailRow';
import ReactDOM from 'react-dom';
import React from 'react';
import Table from 'react-bootstrap/Table';
import { Button } from 'react-bootstrap';

class App extends React.Component {

    constructor(props) {
        super(props);

        this.initialState = {
            trails: {},
            isOnAllTrails: false
        };
        this.state = Object.assign({}, this.initialState);

        this.sendEvent = this.sendEvent.bind(this);
        this.checkIfOnAllTrails = this.checkIfOnAllTrails.bind(this);
        this.addTrailOnTab = this.addTrailOnTab.bind(this);
        this.loadTrails = this.loadTrails.bind(this);
        this.removeTrail = this.removeTrail.bind(this);
        this.clearStorage = this.clearStorage.bind(this);

        // Update some initial state
        this.checkIfOnAllTrails();
        this.loadTrails();
    }

    render() {
        if (Object.keys(this.state.trails).length > 0) {
            return (
                <div>
                    <div className='header'>
                        <h3>Saved Trails</h3>
                        <Button className='btn-sm float-right' variant='danger' onClick={this.clearStorage}>Remove all</Button>

                        { this.state.isOnAllTrails &&
                            <Button id='add-trails-button' className='btn-sm float-right' variant='success' onClick={this.addTrailOnTab}>Add Trail</Button>
                        }
                    </div>

                    <Table className='table-striped'>
                        <thead>
                            <tr>
                                <th></th>
                                <th className='trail-row-header'>Title</th>
                                <th>Elevation</th>
                                <th>Distance</th>
                                <th>Duration</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(this.state.trails).map(id =>
                                <TrailRow
                                    key={id}
                                    trail={this.state.trails[id]}
                                    onRemove={() => {
                                        this.removeTrail(id)
                                    }}
                                />)}
                        </tbody>
                    </Table>
                </div>

            )
        }

        return (
            <div className='header'>
                <h3>No trails added yet</h3>
                <p>Add trails from the trail detail page on AllTrails</p>
                { this.state.isOnAllTrails &&
                    <Button className='btn-sm' variant='success' onClick={this.addTrailOnTab}>Add Trail</Button>
                }
            </div>
        )
    }

    loadTrails() {
        const newThis = this;

        const fetchData = () => {
            chrome.storage.local.get('savedTrails', function (result) {
                const savedTrails = result.savedTrails
                var newState = newThis.state;
                newState.trails = savedTrails || {};
                newThis.setState(newState);
            });
        };

        chrome.storage.local.onChanged.addListener(fetchData);
        fetchData();
    }

    persistTrails() {
        chrome.storage.local.set({ savedTrails: this.state.trails });
    }

    clearStorage() {
        chrome.storage.local.clear(() => {
            this.sendEvent("clear_trails");

            this.setState(this.initialState);
            this.checkIfOnAllTrails();
        });
    }

    removeTrail(id) {
        var newState = this.state;
        delete newState.trails[id];
        this.setState(newState);
        this.persistTrails();

        this.sendEvent("remove_trail");
    }

    addTrailOnTab() {
        this.sendEvent("add_trail");
    }

    checkIfOnAllTrails() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTabUrl = tabs[0].url;
            const allTrailsDomain = "https://www.alltrails.com/";

            if (currentTabUrl.startsWith(allTrailsDomain)) {
                const path = currentTabUrl.replace(allTrailsDomain, "");
                if (path.startsWith("trail") || path.startsWith("explore/trail")) {
                    var newState = this.state;
                    newState.isOnAllTrails = true;
                    this.setState(newState);
                }
            }
        });
    }

    sendEvent(event) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { event });
            chrome.runtime.sendMessage({ event });
        });
    }
}
ReactDOM.render(
    <App />,
    document.getElementById('app')
);
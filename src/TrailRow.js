import Button from 'react-bootstrap/Button';
import CloseButton from 'react-bootstrap/CloseButton';
import React from 'react'

const feetPerMeter = 3.280839895;
const milesPerMeter = 0.000621371;

const minutesToString = minutes => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes - (hours * 60);
    return hours + "h " + remainingMinutes + "m";
}

function TrailRow({ 
    trail: { id, title, elevationGain, length, hikingDuration, url, location },
    onRemove }) {
    return (
        <tr key={id} className='trail-row'>
            <td>
                <CloseButton onClick={onRemove}>Remove</CloseButton>
            </td>
            <td className='trail-title'>
                <a href={url} target='_blank'>{title}</a>
            </td>
            <td>{Math.round(elevationGain * feetPerMeter)} ft</td>
            <td>{(length * milesPerMeter).toFixed(1)} mi</td>
            <td>{minutesToString(hikingDuration)}</td>
            <td>
                {location && 
                    <a className='btn-secondary btn-sm' href={`https://www.google.com/maps/dir/Current+Location/${location.lat},${location.long}`} target="_blank">Directions</a>
                }
            </td>
        </tr>
    )
}
export default TrailRow
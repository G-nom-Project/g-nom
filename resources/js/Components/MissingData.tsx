/**
 * Re-usable component visually indicating missing data
 * @constructor
 */
const MissingData = ({msg="No data"}) => {
    return (
        <div className="text-center">
            <img style={{ maxHeight: '20vh' }} src="/images/searching.png" alt="gnom-missing-data" />
            {(msg != 'No data' && <h4 className="text-muted">{msg}</h4>) || <h2 className="text-muted">{msg}</h2>}
        </div>
    );
}

export default MissingData;

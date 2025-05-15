import React from 'react';

// Define the POs and PSOs for easier looping
const POS = Array.from({ length: 12 }, (_, i) => `po${i + 1}`); // po1 to po12
const PSOS = Array.from({ length: 4 }, (_, i) => `pso${i + 1}`); // pso1 to pso4

function CourseOutcomeMappingRow({ index, outcomeData, onChange, onRemove }) {

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const isNumericField = POS.includes(name) || PSOS.includes(name);
    const processedValue = isNumericField ? (parseInt(value, 10) || 0) : value;
    const finalValue = isNumericField
      ? Math.max(0, Math.min(3, processedValue))
      : processedValue;
    onChange(index, name, finalValue);
  };

  // Shared input classes for consistency
  const baseInputClass = "w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500";
  const numberInputClass = `${baseInputClass} text-center appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`; // Hides spinners

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      {/* CO Identifier */}
      <td className="border  border-gray-300 px-2 py-1 align-top min-w-[90px]"> {/* Added align-top */}
        <input
          type="text"
          name="coIdentifier"
          placeholder="e.g., CO1"
          value={outcomeData.coIdentifier || ''}
          onChange={handleInputChange}
          required
          className={`${baseInputClass} mt-1  bg-white`} // Added margin-top to align better
        />
      </td>

      {/* PO Inputs */}
      {POS.map((poKey) => (
        <td key={poKey} className="border border-gray-300 px-1 py-1 w-[55px]"> {/* Narrower cell */}
          <input
            type="number"
            name={poKey}
            min="0"
            max="3"
            value={outcomeData[poKey] ?? 0}
            onChange={handleInputChange}
            required
            className={`${numberInputClass} w-[45px] mx-auto bg-white`} // Fixed width, centered
          />
        </td>
      ))}

      {/* PSO Inputs */}
      {PSOS.map((psoKey) => (
        <td key={psoKey} className="border   border-gray-300 px-1 py-1 w-[55px]"> {/* Narrower cell */}
           <input
            type="number"
            name={psoKey}
            min="0"
            max="3"
            value={outcomeData[psoKey] ?? 0}
            onChange={handleInputChange}
            required
            className={`${numberInputClass} w-[45px] mx-auto bg-white`} // Fixed width, centered
          />
        </td>
      ))}

      {/* Action Button */}
      <td className="border    border-gray-300 px-2 py-1 align-middle text-center w-[90px]">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
          title="Remove this CO row"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

export default CourseOutcomeMappingRow;
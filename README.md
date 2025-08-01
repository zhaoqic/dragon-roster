# Dragon Roster

A modern web application for optimizing dragon boat team seating arrangements. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🚀 Core Functionality
- **Paddler Management**: Add, edit, and remove paddlers with detailed attributes
- **Visual Layout**: Interactive drag-and-drop boat layout with 20 seats (10 rows)
- **Real-time Metrics**: Live balance calculations and optimization warnings

### 📊 Assignment Algorithm
The auto seat assignment is a simple heuristic algorithm that considers multiple factors:
1. **Side Preferrers**: Respect paddlers' side preferences whenever possible
2. **Engine Strength Priority**: Places high-strength paddlers in rows 4-7
3. **Timing Box Experience Priority**: Places experienced paddlers in rows 1-3
4. **Weight Optimization**: Iteratively swaps paddlers to minimize side and front-back imbalance

Future enhancements may include optimization algorithms for better weight distribution.


## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dragon-roster
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding Paddlers
1. Navigate to the "Paddlers" tab
2. Fill in paddler details:
   - Name, gender, weight, height
   - Preferred side (Left, Right, Either)
   - Strength score (1-5)
   - Experience score (1-5)
   - Optional special notes
3. Click "Add Paddler"

### Creating Lineups
1. Go to the "Layout" tab
2. Configure assignment preferences:
   - Experience in front rows
   - Strength in back rows
   - Weight balancing
   - Side preference respect
3. Click "Auto Assign" for algorithm-based assignment
4. Manually drag and drop paddlers to fine-tune
5. Lock seats to prevent accidental changes

### Analyzing Performance
1. Visit the "Metrics" tab to see:
   - Weight distribution and balance
   - Side preference satisfaction
   - Strength distribution by row
   - Warnings and recommendations

### Managing Lineups
1. Use the "Save/Load" tab to:
   - Save current lineup with a name
   - Load previously saved lineups
   - Export lineups as PDF or CSV
   - Delete unwanted lineups

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main application page
├── components/         # React components
│   ├── BoatLayout.tsx  # Drag-and-drop boat visualization
│   ├── LineupManager.tsx # Save/load functionality
│   ├── MetricsDisplay.tsx # Performance metrics
│   └── PaddlerForm.tsx # Paddler input form
├── types/             # TypeScript type definitions
│   └── index.ts       # Core interfaces and types
└── utils/             # Utility functions
    ├── pdfExport.ts   # PDF generation
    ├── seatAssignment.ts # Assignment algorithm
    └── storage.ts     # Local storage management
```

## Building for Production

```bash
npm run build
npm start
```

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```



## Browser Support

This application is designed to work on desktop:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
Mobile support is limited but functional on modern browsers.

## Future Enhancements
- **Optimization Algorithms**: Use integer programming for better weight distribution
- **User Accounts**: Allow saving lineups to user profiles
- **Team Management**: Support multiple teams with shared paddler databases
- **Alternative Layouts**: Support different boat configurations (e.g., 10 seats, open vs. women boats)

## License

MIT License - feel free to use this project for your dragon boat team!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues or questions, please create an issue in the GitHub repository.
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

const BRAND = { $value: { colorSpace: 'srgb', components: [0.2, 0.4, 0.9] } };

export interface LiveSample {
  label: string;
  /** Issue codes and lint rule ids it reports. A test holds this to the real output. */
  expect: string[];
  source: string;
}

/** Short files for the landing page, small enough to read at a glance. */
export const LIVE_SAMPLES: LiveSample[] = [
  {
    label: 'Color',
    expect: ['color.color-space.invalid'],
    source: json({
      color: {
        $type: 'color',
        brand: { $value: { colorSpace: 'sRGB', components: [0.2, 0.4, 0.9] } },
      },
    }),
  },
  {
    label: 'Unit',
    expect: ['dimension.unit.missing'],
    source: json({
      spacing: {
        $type: 'dimension',
        small: { $value: { value: 8 } },
      },
    }),
  },
  {
    label: 'Alias',
    expect: ['alias.target.missing', 'no-unused-tokens'],
    source: json({
      color: {
        $type: 'color',
        brand: BRAND,
        primary: { $value: '{color.brnad}' },
      },
    }),
  },
  {
    label: 'Lint',
    expect: ['no-empty-groups', 'no-unused-tokens'],
    source: json({
      color: {
        $type: 'color',
        brand: BRAND,
        legacy: {},
      },
    }),
  },
  {
    label: 'Valid',
    expect: ['no-unused-tokens'],
    source: json({
      color: {
        $type: 'color',
        brand: BRAND,
        primary: { $value: '{color.brand}' },
      },
    }),
  },
];

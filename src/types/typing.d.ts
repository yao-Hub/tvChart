declare type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

declare type Nominal<T, Name extends string> = T & {
	/** The 'name' or species of the nominal. */
	[Symbol.species]: Name;
};

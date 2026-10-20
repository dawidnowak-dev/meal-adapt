/** One user exclusion as returned by the API. */
export interface ExclusionDTO {
  productId: string;
  /** Catalog name; equals productId when the product is no longer selectable. */
  name: string;
  /** False when productId is outside the current `selectableExclusionIds`. */
  supported: boolean;
  createdAt: string;
}

export interface ExclusionListDTO {
  exclusions: ExclusionDTO[];
}

export interface AddExclusionCommand {
  productId: string;
}

export interface ApiErrorDTO {
  error: {
    code: string;
    /** Polish message shown to the user. */
    message: string;
  };
}

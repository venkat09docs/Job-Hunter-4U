import { useProfileBuildingPoints } from './useProfileBuildingPoints';

export const useResourceSavePoints = () => {
  const {
    awardCoverLetterSavedPoints,
    awardResumeSavedPoints,
    awardReadmeSavedPoints,
    isAwarding
  } = useProfileBuildingPoints();

  // Method to be called when a cover letter is saved to resources library
  const onCoverLetterSaved = async () => {
    return await awardCoverLetterSavedPoints();
  };

  // Method to be called when a resume is saved to resources library
  const onResumeSaved = async () => {
    return await awardResumeSavedPoints();
  };

  // Method to be called when a README file is saved to resources library
  const onReadmeSaved = async () => {
    return await awardReadmeSavedPoints();
  };

  return {
    onCoverLetterSaved,
    onResumeSaved,
    onReadmeSaved,
    isAwarding
  };
};
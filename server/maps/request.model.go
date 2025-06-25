package maps

// Complete the following request models

type AddReview struct{
}

type RequestAddLocation struct {

}

type AddNotice struct {
	NoticeId          string `gorm:"uniqueIndex" json:"notice_id"`
	Title             string `json:"title" binding:"required"`
	Preview   	      string `json:"preview"`
	CardDescription	  string `json:"cardDescription"`
	Description       string `json:"description"`
	ContributedBy     string `json:"contributedBy"`
}
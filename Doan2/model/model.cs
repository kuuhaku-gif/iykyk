using System;

namespace Doan2.model
{
    public class MovieModel
    {
        public int MovieId { get; set; }
        public string Title { get; set; }
        public string Category { get; set; }
        public int Duration { get; set; }
        public string Poster { get; set; }
        public string Description { get; set; }
        public DateTime ReleaseDate { get; set; }
        public bool IsActive { get; set; }
    }
}